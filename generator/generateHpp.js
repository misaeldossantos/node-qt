const { genInclude } = require("./utils")

function generateHpp(component) {
     const wrapNameClass = `${component.qtComponent}Wrap`
     const {qClassName} = component
     const events = component?.subClass?.events || []
     return `
#ifndef ${wrapNameClass.toUpperCase()}_H
#define ${wrapNameClass.toUpperCase()}_H
${genInclude("<" + component.qtComponent + ">")}
${genInclude("<napi.h>")}
${genInclude("<iostream>")}

${component.includes?.map(genInclude)?.join("\n") || ""}

${genInclude('"../utils/unwrapper.hpp"')}
${component.subClass?.template?.header || ""}

class ${wrapNameClass} : public Napi::ObjectWrap<${wrapNameClass}>
{
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  ${wrapNameClass}(const Napi::CallbackInfo &info);
  ~${wrapNameClass}();

  ${qClassName} *q_;

private:
  static Napi::FunctionReference constructor;
  ${[...component.methods, ...events].map(method => {
    return `Napi::Value ${method.name}(const Napi::CallbackInfo & info);`
  }).join("\n\t")}
  ${events.map(event => {
    return `void ${event.name}(${event.type} *e);`
  }).join("\n\t")}
};

#endif
     `
}

module.exports = generateHpp