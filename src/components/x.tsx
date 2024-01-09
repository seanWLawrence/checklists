export const X: React.FC<{} & React.HTMLAttributes<HTMLSpanElement>> = ({
  ...rest
}) => {
  return <span  {...rest}>&#10005;</span>;
};
