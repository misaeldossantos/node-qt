const { genInclude, cppObjectToNapiArray, cppObjectToNapiObject } = require("./utils")

function generateSuperClass(subClass) {
     const className = `${subClass.extends}Impl`
     const header = `
${subClass.includes.map(genInclude).join("\n\t")}

class ${className} : public ${subClass.extends}             
{                                                    
public:                                              
     ${className}(QWidget *parent, Napi::Env env);

     ${subClass.events.map(event => {
          return `Napi::FunctionReference ${event.name}Callback_;`
        }).join("nt")}            
                                                       
     Napi::Env env;                                   
     bool closed = false;                             
                                                       
private:                                             
     ${subClass.events.map(event => {
          return `void ${event.name}(${event.type} *e);`
     })}                  
};
`

     const implementation = `
${className}::${className}(QWidget *parent, Napi::Env env) : ${subClass.extends}(parent), env(env) 
{                                                                                              
}

${subClass.events.map(event => {
     return `
void ${className}::${event.name}(${event.type} *e)                                             
{                                                                                              
     if (${event.name}Callback_.IsEmpty())                                                             
          return;
          
     Napi::Object output = Napi::Object::New(env);

     ${cppObjectToNapiObject("output", "e->", event.attrs)}
                                                                                               
     ${event.name}Callback_.Call({output});                        
}
`
})}

`
     return {
          name: className,
          template: {
               header, 
               implementation
          }
     }

}



module.exports = generateSuperClass