"use client";
import { useCallback, useId, useReducer } from "react";
import { X } from "./x";
import { cn } from "@/lib/utils";

interface State {
  checked?: boolean;
}

type Action = { type: "TOGGLE" };

export const Checkbox: React.FC<
  { children: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>
> = ({ children, ...rest }) => {
  const [state, dispatch] = useReducer(
    (state: State, action: Action) => {
      if (action.type === "TOGGLE") {
        return { checked: !state.checked } satisfies State;
      }
      return state;
    },
    { checked: rest.defaultChecked || rest.checked } satisfies State,
  );

  const id = useId();

  const onChange = () => {
    dispatch({ type: "TOGGLE" });
  };

  return (
    <div>
      <input
        type="checkbox"
        className="hidden"
        {...rest}
        checked={state.checked}
        id={id}
      />

      <label
        htmlFor={id}
        onClick={onChange}
        className="flex items-center space-x-2 cursor-pointer"
      >
        <button
          type="button"
          className="border-2 border-zinc-900 rounded h-6 w-6 text-[1rem] flex justify-center items-center"
        >
          {state.checked && <X />}
        </button>

        <span
          className={cn("text-sm text-zinc-800", {
            "line-through": state.checked,
          })}
        >
          {children}
        </span>
      </label>
    </div>
  );
};
