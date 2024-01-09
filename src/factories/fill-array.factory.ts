export const fillArray = <T extends unknown>({
  length,
  factory,
}: {
  length: number;
  factory: (index: number) => T;
}): T[] => {
  return new Array(length).fill(null).map((_, index) => {
    return factory(index);
  });
};
