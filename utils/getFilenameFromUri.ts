export const getFileNameFromUri = (uri: string): string => {
    // Split by / and take last part
    return uri.split('/').pop() || 'unknown';
  };