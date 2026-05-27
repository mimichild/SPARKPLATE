export const documentDirectory = '/mock/documents/';
export const copyAsync = jest.fn().mockResolvedValue(undefined);
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const getInfoAsync = jest.fn().mockResolvedValue({ exists: true, isDirectory: false });
export const downloadAsync = jest.fn().mockResolvedValue({ uri: '/mock/downloaded' });
export const EncodingType = { UTF8: 'utf8', Base64: 'base64' };
export const Paths = { document: { uri: '/mock/documents/' } };
export class File {}
export class Directory {}
