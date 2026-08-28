jest.mock('expo-file-system');
jest.mock('expo-media-library');

import { copyAsync } from 'expo-file-system';
import { saveToLibraryAsync } from 'expo-media-library';
import { generateDatedFilename, saveDatedPhotoToLibrary } from '@/services/mediaLibraryService';

describe('mediaLibraryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDatedFilename', () => {
    it('formats the filename so that lexicographic order matches chronological order', () => {
      const earlier = generateDatedFilename(new Date(2026, 7, 28, 9, 5, 3, 7));
      const later = generateDatedFilename(new Date(2026, 7, 28, 15, 30, 45, 123));
      expect(earlier < later).toBe(true);
    });

    it('ends with .jpg', () => {
      expect(generateDatedFilename(new Date(2026, 7, 28, 9, 5, 3, 7))).toMatch(/\.jpg$/);
    });

    it('zero-pads every date/time component', () => {
      const name = generateDatedFilename(new Date(2026, 0, 2, 3, 4, 5, 6));
      expect(name).toBe('SPARKPLATE_20260102_030405006.jpg');
    });
  });

  describe('saveDatedPhotoToLibrary', () => {
    it('copies the source file to a dated filename before saving to the library', async () => {
      await saveDatedPhotoToLibrary('/tmp/random-uuid.jpg');

      expect(copyAsync).toHaveBeenCalledTimes(1);
      const call = (copyAsync as jest.Mock).mock.calls[0][0];
      expect(call.from).toBe('/tmp/random-uuid.jpg');
      expect(call.to).toMatch(/SPARKPLATE_\d{8}_\d{9}\.jpg$/);

      expect(saveToLibraryAsync).toHaveBeenCalledTimes(1);
      expect(saveToLibraryAsync).toHaveBeenCalledWith(call.to);
    });
  });
});
