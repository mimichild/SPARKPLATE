export const manipulateAsync = jest.fn().mockResolvedValue({
  uri: '/mock/photos/compressed.jpg',
  width: 400,
  height: 400,
});

export const SaveFormat = { JPEG: 'jpeg', PNG: 'png' };
export const FlipType = { Vertical: 'vertical', Horizontal: 'horizontal' };
