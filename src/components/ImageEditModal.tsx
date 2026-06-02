import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Image, TouchableOpacity, Text, StyleSheet,
  Dimensions, PanResponder, ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSettingsStore } from '@/stores/settingsStore';

const DS = Math.round(Dimensions.get('window').width);

interface Props {
  visible: boolean;
  sourceUri: string;
  onConfirm: (uri: string) => void;
  onSkip: () => void;
}

type Transform = { scale: number; x: number; y: number };
const DEFAULT_TRANSFORM: Transform = { scale: 1, x: 0, y: 0 };

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }
function touchDist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function ImageEditModal({ visible, sourceUri, onConfirm, onSkip }: Props) {
  const { fontColor } = useSettingsStore();
  const [brightness, setBrightness] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [mode, setMode] = useState<'adjust' | 'rotate' | 'crop'>('adjust');
  const [imgTransform, setImgTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [saving, setSaving] = useState(false);
  const imageRef = useRef<View>(null);

  // Refs — safe to read inside any callback without stale closure
  const imgTransformRef = useRef<Transform>(DEFAULT_TRANSFORM);
  useEffect(() => { imgTransformRef.current = imgTransform; }, [imgTransform]);

  const brightnessRef = useRef(0);
  useEffect(() => { brightnessRef.current = brightness; }, [brightness]);
  const sliderStart = useRef(0);

  const rotationRef = useRef(0);
  useEffect(() => { rotationRef.current = rotation; }, [rotation]);
  const rotSliderStart = useRef(0);

  // Gesture state for pinch+pan (crop mode)
  const g = useRef({ prevDist: 0, prevCX: 0, prevCY: 0 });

  useEffect(() => {
    if (visible) {
      setBrightness(0);
      setRotation(0);
      rotationRef.current = 0;
      setMode('adjust');
      const def = { ...DEFAULT_TRANSFORM };
      setImgTransform(def);
      imgTransformRef.current = def;
      g.current = { prevDist: 0, prevCX: 0, prevCY: 0 };
    }
  }, [visible]);

  // ── Raw-responder handlers for crop pinch+pan ─────────────────────
  // Using raw View responder props instead of PanResponder so that
  // evt.nativeEvent.touches reliably contains ALL active touches on
  // Android (Fabric / new architecture).

  function onCropGrant(evt: GestureResponderEvent) {
    const t = evt.nativeEvent.touches;
    g.current.prevDist = 0;
    if (t.length >= 2) {
      g.current.prevDist = touchDist(t[0].pageX, t[0].pageY, t[1].pageX, t[1].pageY);
      g.current.prevCX = (t[0].pageX + t[1].pageX) / 2;
      g.current.prevCY = (t[0].pageY + t[1].pageY) / 2;
    } else if (t.length >= 1) {
      g.current.prevCX = t[0].pageX;
      g.current.prevCY = t[0].pageY;
    }
  }

  function onCropMove(evt: GestureResponderEvent) {
    const t = evt.nativeEvent.touches;
    const cur = imgTransformRef.current;
    const gs = g.current;

    if (t.length >= 2) {
      const d  = touchDist(t[0].pageX, t[0].pageY, t[1].pageX, t[1].pageY);
      const cx = (t[0].pageX + t[1].pageX) / 2;
      const cy = (t[0].pageY + t[1].pageY) / 2;

      if (gs.prevDist === 0) {
        // First frame with 2 touches — anchor without a jump
        gs.prevDist = d; gs.prevCX = cx; gs.prevCY = cy;
        return;
      }

      const newScale = clamp(cur.scale * (d / gs.prevDist), 0.3, 6);
      const next: Transform = {
        scale: newScale,
        x: cur.x + (cx - gs.prevCX),
        y: cur.y + (cy - gs.prevCY),
      };
      gs.prevDist = d; gs.prevCX = cx; gs.prevCY = cy;
      imgTransformRef.current = next;
      setImgTransform(next);

    } else if (t.length === 1) {
      if (gs.prevDist !== 0) {
        // Lifted one finger — re-anchor without a jump
        gs.prevDist = 0;
        gs.prevCX = t[0].pageX;
        gs.prevCY = t[0].pageY;
        return;
      }
      const next: Transform = {
        scale: cur.scale,
        x: cur.x + (t[0].pageX - gs.prevCX),
        y: cur.y + (t[0].pageY - gs.prevCY),
      };
      gs.prevCX = t[0].pageX;
      gs.prevCY = t[0].pageY;
      imgTransformRef.current = next;
      setImgTransform(next);
    }
  }

  function onCropRelease() {
    g.current.prevDist = 0;
  }

  // ── Brightness slider (single-touch PanResponder — works fine) ────
  const sliderOnChange = useRef((v: number) => setBrightness(v));
  useEffect(() => { sliderOnChange.current = (v) => setBrightness(v); }, []);

  const sliderPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { sliderStart.current = brightnessRef.current; },
    onPanResponderMove: (_, gs) => {
      const delta = (gs.dx / (DS - 48)) * 4;
      sliderOnChange.current(clamp(sliderStart.current + delta, -1, 1));
    },
  })).current;

  // ── Rotation slider ───────────────────────────────────────────────
  const rotSliderOnChange = useRef((v: number) => setRotation(v));
  useEffect(() => { rotSliderOnChange.current = (v) => setRotation(v); }, []);

  const rotSliderPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { rotSliderStart.current = rotationRef.current; },
    onPanResponderMove: (_, gs) => {
      const delta = (gs.dx / (DS - 48)) * 180;
      rotSliderOnChange.current(clamp(rotSliderStart.current + delta, -90, 90));
    },
  })).current;

  // ── Confirm ───────────────────────────────────────────────────────
  async function handleConfirm() {
    const noBrightness = Math.abs(brightness) < 0.01;
    const noRotation   = Math.abs(rotation) < 0.5;
    const noTransform  =
      Math.abs(imgTransform.scale - 1) < 0.01 &&
      Math.abs(imgTransform.x) < 1 &&
      Math.abs(imgTransform.y) < 1;

    if (noBrightness && noRotation && noTransform) {
      onConfirm(sourceUri); return;
    }

    setSaving(true);
    try {
      const uri = await captureRef(imageRef, { format: 'jpg', quality: 0.95 });
      onConfirm(uri);
    } catch {
      onConfirm(sourceUri);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  const overlayColor = brightness > 0
    ? `rgba(255,255,255,${brightness * 0.55})`
    : `rgba(0,0,0,${Math.abs(brightness) * 0.55})`;

  const thumbLeft = ((brightness + 1) / 2) * (DS - 48);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onSkip} style={styles.headerBtn}>
            <Text style={styles.skipText}>跳過</Text>
          </TouchableOpacity>
          <Text style={styles.title}>調整照片</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <View style={[styles.doneChip, { backgroundColor: fontColor }]}>
                  <Text style={styles.doneText}>完成</Text>
                </View>
            }
          </TouchableOpacity>
        </View>

        {/* Image area (captured by ViewShot) */}
        <View
          ref={imageRef}
          collapsable={false}
          style={styles.imageContainer}
        >
          {/* Transformable layer — always apply transform so crop persists when switching modes */}
          <View style={[
            styles.imageLayer,
            {
              transform: [
                { rotate: `${rotation}deg` },
                { scale: imgTransform.scale },
                { translateX: imgTransform.x },
                { translateY: imgTransform.y },
              ],
            },
          ]}>
            <Image source={{ uri: sourceUri }} style={styles.image} resizeMode="cover" />
            {Math.abs(brightness) > 0.01 && (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
                pointerEvents="none"
              />
            )}
          </View>

          {/* Crop: raw-responder touch area + border guide */}
          {mode === 'crop' && (
            <>
              {/* Transparent overlay that captures ALL touches */}
              <View
                style={StyleSheet.absoluteFill}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderTerminationRequest={() => false}
                onResponderGrant={onCropGrant}
                onResponderMove={onCropMove}
                onResponderRelease={onCropRelease}
                onResponderTerminate={onCropRelease}
              />
              <View
                style={[StyleSheet.absoluteFill, styles.cropBorder]}
                pointerEvents="none"
              />
            </>
          )}
        </View>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'adjust' && { backgroundColor: fontColor }]}
            onPress={() => setMode('adjust')}
          >
            <Text style={[styles.modeBtnText, mode === 'adjust' && styles.modeBtnActive]}>☀️ 亮度</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'rotate' && { backgroundColor: fontColor }]}
            onPress={() => setMode('rotate')}
          >
            <Text style={[styles.modeBtnText, mode === 'rotate' && styles.modeBtnActive]}>🔄 旋轉</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'crop' && { backgroundColor: fontColor }]}
            onPress={() => setMode('crop')}
          >
            <Text style={[styles.modeBtnText, mode === 'crop' && styles.modeBtnActive]}>✂️ 裁切</Text>
          </TouchableOpacity>
        </View>

        {/* Brightness slider */}
        {mode === 'adjust' && (
          <View style={styles.sliderArea} {...sliderPan.panHandlers}>
            <Text style={styles.sliderLabel}>
              {brightness > 0.01
                ? `+${Math.round(brightness * 100)}%`
                : brightness < -0.01
                  ? `${Math.round(brightness * 100)}%`
                  : '0%'}
            </Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: Math.max(0, thumbLeft), backgroundColor: fontColor }]} />
              <View style={[styles.sliderThumb, { left: thumbLeft - 12, borderColor: fontColor }]} />
            </View>
          </View>
        )}

        {/* Rotation controls */}
        {mode === 'rotate' && (
          <View style={styles.rotateArea}>
            <View style={styles.rotateQuickRow}>
              <TouchableOpacity
                style={styles.rotateQuickBtn}
                onPress={() => setRotation(r => clamp(r - 90, -90, 90))}
              >
                <Text style={styles.rotateQuickIcon}>↺</Text>
                <Text style={styles.rotateQuickLabel}>左轉 90°</Text>
              </TouchableOpacity>
              <Text style={styles.rotateDegreeLabel}>
                {rotation > 0.5
                  ? `+${Math.round(rotation)}°`
                  : rotation < -0.5
                    ? `${Math.round(rotation)}°`
                    : '0°'}
              </Text>
              <TouchableOpacity
                style={styles.rotateQuickBtn}
                onPress={() => setRotation(r => clamp(r + 90, -90, 90))}
              >
                <Text style={styles.rotateQuickIcon}>↻</Text>
                <Text style={styles.rotateQuickLabel}>右轉 90°</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sliderArea} {...rotSliderPan.panHandlers}>
              <Text style={styles.sliderLabel}>自由旋轉（−90° ⟷ +90°）</Text>
              {(() => {
                const rotThumb = ((rotation + 90) / 180) * (DS - 48);
                return (
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: Math.max(0, rotThumb), backgroundColor: fontColor }]} />
                    <View style={[styles.sliderThumb, { left: rotThumb - 12, borderColor: fontColor }]} />
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {mode === 'crop' && (
          <Text style={styles.cropHint}>兩指捏合縮放・單指拖移位置</Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerBtn: { paddingHorizontal: 4, paddingVertical: 4, minWidth: 60, alignItems: 'center' },
  skipText: { color: '#aaa', fontSize: 15 },
  doneChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  doneText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  imageContainer: { width: DS, height: DS, overflow: 'hidden', backgroundColor: '#000' },
  imageLayer: { width: DS, height: DS },
  image: { width: DS, height: DS },
  cropBorder: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },

  modeRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 12, paddingTop: 20, paddingHorizontal: 24,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#222', alignItems: 'center' },
  modeBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  modeBtnActive: { color: '#fff' },

  sliderArea: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
  sliderLabel: { color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  sliderTrack: { height: 4, backgroundColor: '#444', borderRadius: 2, position: 'relative' },
  sliderFill: { height: 4, borderRadius: 2 },
  sliderThumb: {
    position: 'absolute', top: -10, width: 24, height: 24,
    borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, elevation: 3,
  },
  cropHint: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 20 },

  rotateArea: { paddingTop: 20 },
  rotateQuickRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 4,
  },
  rotateQuickBtn: { alignItems: 'center', padding: 8 },
  rotateQuickIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
  rotateQuickLabel: { color: '#aaa', fontSize: 11, marginTop: 2 },
  rotateDegreeLabel: { color: '#fff', fontSize: 20, fontWeight: '600', minWidth: 60, textAlign: 'center' },
});
