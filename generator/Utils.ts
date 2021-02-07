import { Method } from "./model/GeneratorSchema";

export function requiredParam(value, param) {
  if (!value) throw new Error("Param is required: " + param);
}

export function generateIncludes(...includes) {
  return includes.map((include) => `#include ${include}`);
}

export function joinLines(
  array: string[],
  identTabs: number = 0,
  joinWith: string = ""
) {
  if (!array.length) return "";
  const identTabsStr = (new Array(identTabs) as any).fill("\t").join("");
  return (
    identTabsStr + array.filter(Boolean).join(joinWith + "\n" + identTabsStr)
  );
}

export const napiFunctions = {
  getMethodInstance(method: Method, className: string) {
    return `InstanceMethod("${method.name}", &${className}::${method.name})`;
  },
};
