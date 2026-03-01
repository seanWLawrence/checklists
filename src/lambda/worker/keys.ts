export const getJobPk = ({ username }: { username: string }) => {
  return `user#${username}`;
};

export const getJobSk = ({ jobId }: { jobId: string }) => {
  return `job#${jobId}`;
};
