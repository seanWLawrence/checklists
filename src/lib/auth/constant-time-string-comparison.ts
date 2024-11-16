export const constantTimeStringComparison = (
  val1: string,
  val2: string,
): boolean => {
  if (val1.length !== val2.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < val1.length; i++) {
    result |= val1.charCodeAt(i) ^ val2.charCodeAt(i);
  }

  return result === 0;
};
