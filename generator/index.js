const generateCpp = require("./generateCpp")
const generateHpp = require("./generateHpp")
const generateSuperClass = require("./generateSubClass")
const components = require("./components")

const fs = require("fs")
const path = require("path")

function saveFile(fileName, result) {
     fs.writeFileSync(path.resolve(__dirname, "../src/QtGui/" + fileName.toLowerCase()), result);
}

for (let component of components) {
     if(component.subClass) {
          const subClass = generateSuperClass(component.subClass)
          component.subClass.name = subClass.name
          component.subClass.template = subClass.template
     }
     component.qClassName = component.subClass?.name || component.qtComponent

     const cpp = generateCpp(component)
     saveFile(component.qtComponent + ".cpp", cpp)
     const hpp = generateHpp(component)
     saveFile(component.qtComponent + ".hpp", hpp)
}