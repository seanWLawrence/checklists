export const getFilePartitionKey = (ownerId: string) => `user#${ownerId}#file`;

export const getFileSortKey = (id: string) => `file#${id}`;
