import { Alert } from 'react-native';
import { confirmOverwrite } from '@/utils/confirmOverwrite';

describe('confirmOverwrite', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => alertSpy.mockRestore());

  function pressButton(text: string) {
    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((b) => b.text === text)?.onPress?.();
  }

  it('shows the overwrite question', () => {
    confirmOverwrite();
    expect(alertSpy).toHaveBeenCalledWith(
      '已存在一張照片了，請問需要覆蓋舊照嗎？',
      undefined,
      expect.any(Array),
      expect.objectContaining({ cancelable: false }),
    );
  });

  it('resolves true when 確定 is pressed', async () => {
    const p = confirmOverwrite();
    pressButton('確定');
    await expect(p).resolves.toBe(true);
  });

  it('resolves false when 取消 is pressed', async () => {
    const p = confirmOverwrite();
    pressButton('取消');
    await expect(p).resolves.toBe(false);
  });
});
