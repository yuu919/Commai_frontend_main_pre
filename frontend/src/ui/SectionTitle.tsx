import React from "react";
import Divider from "./Divider";

type Props = {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  level?: 2 | 3;
  className?: string;
};

export const SectionTitle: React.FC<Props> = ({ children, rightSlot, level = 2, className = "" }) => {
  const Heading = (level === 3 ? ("h3" as const) : ("h2" as const));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading className={["section-card-title", className].join(" ")}>{children}</Heading>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      <Divider />
    </div>
  );
};

export default SectionTitle;


