export type AttributeNames = Record<`#${string}`, string>;

interface GenericRecord {
  [key: string]: string | number | string[] | GenericRecord;
}

export type AttributeValues = Record<
  `:${string}`,
  string | number | string[] | GenericRecord
>;
