export const createRandomNumberString = (size = 6): string => {
  return Math.floor(Math.random() * 10 ** size)
    .toString()
    .padStart(size, '0');
};

export const createRandomNumber = (maxDigit = 6): number => {
  return Math.floor(Math.random() * 10 ** maxDigit);
};
