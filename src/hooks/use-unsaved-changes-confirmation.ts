"use client";

import { useEffect, useRef } from "react";

const confirmationMessage = "You have unsaved changes. Discard them and leave this page?";

export const useUnsavedChangesConfirmation = ({
  formRef,
  getIsDirty,
}: {
  formRef: React.RefObject<HTMLFormElement | null>;
  getIsDirty: () => boolean;
}) => {
  const getIsDirtyRef = useRef(getIsDirty);

  useEffect(() => {
    getIsDirtyRef.current = getIsDirty;
  }, [getIsDirty]);

  useEffect(() => {
    const shouldConfirmNavigation = () => getIsDirtyRef.current();

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldConfirmNavigation()) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (
        !shouldConfirmNavigation() ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.href === window.location.href
      ) {
        return;
      }

      if (!window.confirm(confirmationMessage)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onDocumentSubmit = (event: SubmitEvent) => {
      if (
        !shouldConfirmNavigation() ||
        event.target === formRef.current ||
        window.confirm(confirmationMessage)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("submit", onDocumentSubmit, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("submit", onDocumentSubmit, true);
    };
  }, [formRef]);
};
