const keyBind = {
  up: ["ArrowUp", "z"],
  down: ["ArrowDown", "s"],
  left: ["ArrowLeft", "q"],
  right: ["ArrowRight", "d"],
};

type TypeKeysAction = keyof typeof keyBind;

export type TypeKeysActionUpdate = Partial<Record<TypeKeysAction, number>>;
