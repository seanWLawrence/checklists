export const random = <T>(arr: T[]): T => {
  const maxIndex = arr.length;
  const randomIndex = Math.floor(Math.random() * (maxIndex + 1));

  return arr[randomIndex];
};
