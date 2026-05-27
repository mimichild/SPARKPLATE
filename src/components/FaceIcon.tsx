import React from 'react';
import { View } from 'react-native';
import { Mood } from '@/types';

const SKIN  = '#F5C8A0';
const EYE   = '#3D2B1F';
const MOUTH = '#B06050';
const TEAR  = '#89CFF0';

interface Props {
  mood: Mood;
  size?: number;
}

export function FaceIcon({ mood, size = 36 }: Props) {
  const r = size / 2;
  const eyeSize   = Math.max(2, size * 0.13);
  const eyeGap    = size * 0.21;
  const eyeTop    = size * 0.33;
  const mouthW    = size * 0.44;
  const mouthH    = mouthW / 2;
  const borderW   = Math.max(1.5, size * 0.055);
  const mouthTop  = size * 0.58;
  const browH     = Math.max(1.5, size * 0.05);
  const browW     = size * 0.2;
  const browTop   = eyeTop - size * 0.13;

  // Shared eye positions
  const leftEyeLeft  = r - eyeGap - eyeSize / 2;
  const rightEyeLeft = r + eyeGap - eyeSize / 2;

  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: SKIN, overflow: 'hidden' }}>

      {/* ── Angry brows ── */}
      {mood === 'angry' && (
        <>
          <View style={{
            position: 'absolute', top: browTop,
            left: leftEyeLeft - browW * 0.1,
            width: browW, height: browH,
            backgroundColor: EYE,
            transform: [{ rotate: '20deg' }],
          }} />
          <View style={{
            position: 'absolute', top: browTop,
            left: rightEyeLeft - browW * 0.1,
            width: browW, height: browH,
            backgroundColor: EYE,
            transform: [{ rotate: '-20deg' }],
          }} />
        </>
      )}

      {/* ── Eyes ── */}
      <View style={{
        position: 'absolute', top: eyeTop, left: leftEyeLeft,
        width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2,
        backgroundColor: EYE,
      }} />
      <View style={{
        position: 'absolute', top: eyeTop, left: rightEyeLeft,
        width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2,
        backgroundColor: EYE,
      }} />

      {/* ── Tear (sad) ── */}
      {mood === 'sad' && (
        <View style={{
          position: 'absolute',
          top: eyeTop + eyeSize + size * 0.03,
          left: leftEyeLeft + eyeSize * 0.1,
          width: eyeSize * 0.7,
          height: eyeSize * 1.3,
          borderRadius: eyeSize * 0.35,
          backgroundColor: TEAR,
        }} />
      )}

      {/* ── Mouth ── */}
      {mood === 'happy' && (
        // U-shape (smile up)
        <View style={{
          position: 'absolute',
          top: mouthTop,
          left: (size - mouthW) / 2,
          width: mouthW, height: mouthH,
          borderBottomWidth: borderW,
          borderLeftWidth: borderW,
          borderRightWidth: borderW,
          borderTopWidth: 0,
          borderColor: MOUTH,
          borderBottomLeftRadius: mouthH,
          borderBottomRightRadius: mouthH,
        }} />
      )}

      {(mood === 'sad' || mood === 'angry') && (
        // ∩-shape (frown)
        <View style={{
          position: 'absolute',
          top: mouthTop + mouthH * 0.45,
          left: (size - mouthW) / 2,
          width: mouthW, height: mouthH,
          borderTopWidth: borderW,
          borderLeftWidth: borderW,
          borderRightWidth: borderW,
          borderBottomWidth: 0,
          borderColor: MOUTH,
          borderTopLeftRadius: mouthH,
          borderTopRightRadius: mouthH,
        }} />
      )}

      {mood === 'neutral' && (
        // Flat line
        <View style={{
          position: 'absolute',
          top: mouthTop + mouthH * 0.4,
          left: (size - mouthW * 0.8) / 2,
          width: mouthW * 0.8,
          height: borderW,
          backgroundColor: MOUTH,
          borderRadius: borderW / 2,
        }} />
      )}

    </View>
  );
}
