declare module 'immer' {
  /**
   * Immer takes a state, and runs a function against it.
   * That function can freely mutate the state, as it will create copies-on-write.
   * This means that the original state will stay unchanged, and once the function finishes, the modified state is returned.
   *
   * If the first argument is a function, this is interpreted as the recipe, and will create a curried function that will execute the recipe
   * any time it is called with the current state.
   *
   * @param currentState - the state to start with
   * @param recipe - function that receives a proxy of the current state as first argument and which can be freely modified
   * @param initialState - if a curried function is created and this argument was given, it will be used as fallback if the curried function is called with a state of undefined
   * @returns The next state: a new state, or the current state if nothing was modified
   */
  declare export default function produce<S>(currentState: S, recipe: (draftState: S) => S | void): S;
  // curried invocations with inital state
  declare export default function produce<S, A, B, C>(
    recipe: (draftState: S, a: A, b: B, c: C) => S | void,
    initialState: S
  ): (currentState: S | void, a: A, b: B, c: C) => S;
  declare export default function produce<S, A, B>(
    recipe: (draftState: S, a: A, b: B) => S | void,
    initialState: S
  ): (currentState: S | void, a: A, b: B) => S;
  declare export default function produce<S, A>(
    recipe: (draftState: S, a: A) => S | void,
    initialState: S
  ): (currentState: S | void, a: A) => S;
  declare export default function produce<S>(
    recipe: (draftState: S) => S | void,
    initialState: S
  ): (currentState: S | void) => S;
  declare export default function produce<S>(
    recipe: (draftState: S, ...extraArgs: any[]) => S | void,
    initialState: S
  ): (currentState: S | void, ...extraArgs: any[]) => S;
  // curried invocations without inital state
  declare export default function produce<S, A, B, C>(
    recipe: (draftState: S, a: A, b: B, c: C) => S | void
  ): (currentState: S, a: A, b: B, c: C) => S;
  declare export default function produce<S, A, B>(
    recipe: (draftState: S, a: A, b: B) => S | void
  ): (currentState: S, a: A, b: B) => S;
  declare export default function produce<S, A>(
    recipe: (draftState: S, a: A) => S | void
  ): (currentState: S, a: A) => S;
  declare export default function produce<S>(recipe: (draftState: S) => S | void): (currentState: S) => S;
  declare export default function produce<S>(
    recipe: (draftState: S, ...extraArgs: any[]) => S | void
  ): (currentState: S, ...extraArgs: any[]) => S;
  /**
   * Automatically freezes any state trees generated by immer.
   * This protects against accidental modifications of the state tree outside of an immer function.
   * This comes with a performance impact, so it is recommended to disable this option in production.
   * By default it is turned on during local development, and turned off in production.
   */
  declare export function setAutoFreeze(autoFreeze: boolean): void;

  /**
   * Manually override whether proxies should be used.
   * By default done by using feature detection
   */
  declare export function setUseProxies(useProxies: boolean): void;
}
