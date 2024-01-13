import React, { useState } from "react";
import { ExpandIcon } from "./icons/expand-icon";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Accordion: React.FC<{
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultShowDetails?: boolean;
}> = ({ summary, children, defaultShowDetails }) => {
  const [detailsVisible, setDetailsVisible] = useState<boolean>(
    defaultShowDetails ?? false,
  );

  return (
    <div className="space-y-2 w-full">
      <div className="w-full">
        <div
          className="flex space-x-2"
          onClick={() => {
            setDetailsVisible((prev) => !prev);
          }}
        >
          {summary}

          <Button variant="ghost" type="button" className="mt-6">
            <ExpandIcon />
          </Button>
        </div>
      </div>

      <div className={cn({ hidden: !detailsVisible })}>{children}</div>
    </div>
  );
};
