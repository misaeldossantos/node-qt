import * as _ from 'lodash'

const fns = {
  throwError(msg) {
    return `Napi::TypeError::New(info.Env(), "${msg}")
       .ThrowAsJavaScriptException();`;
  },
  convertCppValueToNapiValue(variable, type) {
    return `Napi::${type}::New(env, ${variable})`;
  },
  convertNapiValueToCppType(napiValue: string, type: string) {
    switch (type) {
      case "Boolean":
        return `${napiValue}.ToBoolean().Value()`;
      case "Integer":
        return `(int) ${napiValue}.ToNumber().Int64Value()`;
      case "String":
        return `QString::fromStdString(${napiValue}.ToString().Utf8Value())`;
      default:
        if (type.endsWith("Wrap")) {
          return `Napi::ObjectWrap<${type}>::Unwrap(info[0].ToObject())->q_`;
        }
    }
  },
  cppObjectToNapiObject(source, host, attrs) {
    const attrsKeys = Object.keys(attrs);

    return attrsKeys
      .map((key) => {
        const type = attrs[key];
        if (typeof type !== "string") {
          const { $source, ...rest } = type;
          const objName = `${key}$${_.random(0, 100)}`;
          const newObject = `Napi::Object ${objName} = Napi::Object::New(env);`;
          const filledObj = fns.cppObjectToNapiObject(
            objName,
            host +
              ($source ? (host.endsWith(">") ? "" : ".") + $source + "()" : ""),
            rest
          );
          const putInObj = `${source}.Set("${key}", ${objName});`;
          return newObject + "\n" + filledObj + "\n" + putInObj;
        }
        return `${source}.Set("${key}", ${fns.convertCppValueToNapiValue(
          `${host}${host.endsWith(">") ? "" : "."}${key}()`,
          type
        )});`;
      })
  },
};

export default fns;
