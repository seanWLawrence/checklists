export const fillArray = <T>({
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
