export const ORDER_FIELD = {
  CREATED_AT: 'CREATED_AT',
  NAME: 'NAME',
  EMAIL: 'EMAIL',
} as const;

export type OrderField = (typeof ORDER_FIELD)[keyof typeof ORDER_FIELD];

export const ORDER_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type OrderDirection =
  (typeof ORDER_DIRECTION)[keyof typeof ORDER_DIRECTION];
