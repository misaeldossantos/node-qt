const lodash = require('lodash')

function genInclude(input) {
     return `#include ${input}`
}

function cppObjectToNapiArray(host, attrs) {
     const keys = Object.keys(attrs)

     return `{
               ${keys.map((key, index) => {
          const type = attrs[key]
          return cppValueToNapiValue(`${host}->${key}`, type)
     }).join(",\n\t")}
          }`

}

function cppObjectToNapiObject(source, host, attrs) {
     const attrsKeys = Object.keys(attrs)

     return `
     ${attrsKeys.map((key) => {
          const type = attrs[key]
          if (typeof type !== "string") {
               const { $source, ...rest } = type
               const objName = `${key}$${lodash.random(0, 100)}`
               const newObject = `Napi::Object ${objName} = Napi::Object::New(env);`
               const filledObj = cppObjectToNapiObject(objName, host + ($source ? (host.endsWith(">")? "": ".") + $source + "()" : ""), rest)
               const putInObj = `\t${source}.Set("${key}", ${objName});`
               return newObject + "\n" + filledObj + "\n" + putInObj
          }
          return `${source}.Set("${key}", ${cppValueToNapiValue(`${host}${(host.endsWith(">")? "": ".")}${key}()`, type)});`
     }).join("\n\t")}
     `
}

function cppValueToNapiValue(variable, type) {
     return `Napi::${type}::New(env, ${variable})`
}

module.exports = {
     genInclude,
     cppObjectToNapiArray,
     cppValueToNapiValue,
     cppObjectToNapiObject
}