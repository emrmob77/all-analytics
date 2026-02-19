type DebouncedFunction<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number
): DebouncedFunction<TArgs> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: TArgs | null = null;

  const debounced = (...args: TArgs) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}

export function throttle<TArgs extends unknown[]>(func: (...args: TArgs) => void, limit: number) {
  let isThrottled = false;
  let trailingArgs: TArgs | null = null;

  function invoke(args: TArgs) {
    func(...args);
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
      if (trailingArgs) {
        const nextArgs = trailingArgs;
        trailingArgs = null;
        invoke(nextArgs);
      }
    }, limit);
  }

  return (...args: TArgs) => {
    if (!isThrottled) {
      invoke(args);
      return;
    }

    trailingArgs = args;
  };
}
