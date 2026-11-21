import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

/**
 * Loads data when the component mounts (and when deps change).
 *   const { data, loading, error, reload } = useAsync(() => accountAPI.list(), []);
 * Responses from an older call are ignored if a newer one has started.
 */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const callId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async ({ silent = false } = {}) => {
    const id = ++callId.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === callId.current) setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      if (id === callId.current) setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
      return undefined;
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: run, setData };
}
