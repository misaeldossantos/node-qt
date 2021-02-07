const { genInclude, cppObjectToNapiObject, cppValueToNapiValue } = require("./utils")

function generateCpp(component) {
     const wrapClassName = `${component.qtComponent}Wrap`
     const methodsImpl = component.methods.map(method => generateImplMethod(method, wrapClassName))
     const {qClassName} = component

     const template = `
${genInclude('"' + component.qtComponent.toLowerCase() + '.hpp"')}

Napi::FunctionReference ${wrapClassName}::constructor;

Napi::Object ${wrapClassName}::Init(Napi::Env env, Napi::Object exports)
{
     Napi::HandleScope scope(env);
     // clang-format off
     Napi::Function func = DefineClass(env, "${component.qtComponent}", {
          ${[...component.methods, ...(component.subClass?.events || [])]
               .map(method => getInstanceMethod(method, wrapClassName)).join(",\n\t")}
     });
     // clang-format on

     constructor = Napi::Persistent(func);
     constructor.SuppressDestruct();

     exports.Set("${component.qtComponent}", func);
     return exports;
}

${wrapClassName}::${wrapClassName}(const Napi::CallbackInfo &info) : Napi::ObjectWrap<${wrapClassName}>(info)
{
     Napi::Env env = info.Env();
     Napi::HandleScope scope(env);
     if (info.Length() > 0)
     {
          QWidget *parent = unwrap(info[0]);
          q_ = new ${qClassName}(parent${component.subClass? ", env": ""});
     } else {
          q_ = new ${qClassName}(0${component.subClass? ", env": ""});
     }
     
}

${wrapClassName}::~${wrapClassName}()
{
     q_ = NULL;
}


// Implementation
${methodsImpl.join("\n\t")}
${component.subClass?.events?.map(event => {
     return `
Napi::Value ${wrapClassName}::${event.name}(const Napi::CallbackInfo &info)                
{                                                                                 
    Napi::Env env = info.Env();                                                   
    Napi::HandleScope scope(env);                                                 
                                                                                  
    q_->${event.name}Callback_ = Napi::Persistent(info[0].As<Napi::Function>());         
                                                                                  
    return Napi::Value();                                                         
}  
`
}) || ""}
// ${component.subClass?.name || ""}
${component.subClass?.template?.implementation || ""}
`
     return template;
}

function getInstanceMethod(method, wrapClassName) {
     return `InstanceMethod("${method.name}", &${wrapClassName}::${method.name})`
}

function generateImplMethod(method, wrapClassName) {
     let body = null

     if(method.returns) {
          body = implementGetMethod(method)
     } else {
          body = implementSetMethod(method)
     }

     return `
Napi::Value ${wrapClassName}::${method.name}(const Napi::CallbackInfo &info)
{
${body}
}`

}

function implementSetMethod(method) {
     const params = method.params.split(",").map(getParameterDeclaration)

     return `
     ${method.paramsRequired? `
     if(info.Length() != ${params.length}) {
          Napi::TypeError::New(info.Env(), "Wrong number of arguments")
               .ThrowAsJavaScriptException();
     }
     `: ""}
     ${params.join("\n\t")}
     
     q_->${method.name}(${params.map((p, index) => `p${index}`).join(", ")});
     return Napi::Value();`
}

function implementGetMethod(method) {
     const returnsObject = method.returns
     const {$source, ...attrs} = returnsObject.attrs

     return `
     Napi::Env env = info.Env();
     Napi::Object output = Napi::Object::New(env);
     ${cppObjectToNapiObject("output", "q_->" + method.name + "()", attrs)}
     return output;
`
}

function getParameterDeclaration(param, index) {
     let declaration = ""
     let block = ""
     switch (param.trim()) {
          case "Boolean":
               declaration = `bool p${index}`
               block = `${declaration} = info[${index}].ToBoolean().Value();`
               break;
          case "Integer":
               declaration = `int p${index}`
               block = `${declaration} = (int) info[${index}].ToNumber().Int64Value();`
               break;
          case "String":
               declaration = `QString* p${index}`
               declaration = `${declaration} = QString::fromStdString(info[${index}].ToString().Utf8Value());`
               break;
          default:
               if (param.endsWith('Wrap')) {
                    const targetClass = param.substring(0, param.length - 4)
                    declaration = `${targetClass}* p${index}`
                    block = `${declaration} = Napi::ObjectWrap<${param}>::Unwrap(info[0].ToObject())->q_;`
               }
     }
     if (!declaration || !block) {
          return ""
     }
     return block
}

module.exports = generateCpp