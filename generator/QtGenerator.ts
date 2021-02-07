import Constants from "./Constants";
import { GeneratorSchema, Method } from "./model/GeneratorSchema";
import {
  generateIncludes,
  joinLines,
  napiFunctions,
  requiredParam,
} from "./Utils";
//@ts-ignore
const components = require("./components.json");

export default class QtGenerator {
  private readonly schema: GeneratorSchema;
  private wrapClassName: string;
  private nativeExtendedClass?: string;
  private nativeInstanceClass: string;
  private nativeInstance = "q_";

  // CODE
  private headerSubclassCode?: string;
  private headerComponentCode?: string;
  private componentCode?: string;
  private headerCode?: string;
  private subclassName?: string;

  constructor(schema: GeneratorSchema) {
    this.schema = schema;
    this.wrapClassName = schema.component + "Wrap";
    this.nativeExtendedClass = this.hasSubclass
      ? schema.subclass.extends + "Impl"
      : null;
    this.nativeInstanceClass = this.nativeExtendedClass || schema.component;
  }

  static of(schema: GeneratorSchema) {
    return new QtGenerator(schema);
  }

  generate() {
    requiredParam(this.schema, "schema");
    this.generateSuperClass();
    this.generateCpp();
    this.generateHpp();
  }

  get hasSubclass() {
    return !!this.schema.subclass;
  }

  get methods() {
    return this.schema.methods || [];
  }

  get events() {
    return this.schema.subclass?.events || [];
  }

  private generateSuperClass() {
    if (!this.hasSubclass) return;
  }

  private generateCpp() {
    const includes = generateIncludes([
      '"' + this.schema.component.toLowerCase() + '.hpp"',
    ]);
    const methods = [...this.methods, this.events].map((method) =>
      napiFunctions.getMethodInstance(method as Method, this.wrapClassName)
    );

    const initMethodImpl = [
      `Napi::Object ${this.wrapClassName}::Init(Napi::Env env, Napi::Object exports)`,
      "{",
      "	Napi::HandleScope scope(env);",
      "	// clang-format off",
      `	Napi::Function func = DefineClass(env, "${this.schema.component}", {`,
      joinLines(methods, 1, ","),
      "	});",
      "	// clang-format on",
      " ",
      "	constructor = Napi::Persistent(func);",
      "	constructor.SuppressDestruct();",
      " ",
      `	exports.Set("${this.schema.component}", func);`,
      "	return exports;",
      "}",
    ];

    const constructorImpl = [
      `${this.wrapClassName}::${this.wrapClassName}(${Constants.CALLBACK_INFO_PARAM}) : Napi::ObjectWrap<${this.wrapClassName}>(info)`,
      "{",
      "	Napi::Env env = info.Env();",
      "	Napi::HandleScope scope(env);",
      "	if (info.Length() > 0)",
      "	{",
      "		QWidget *parent = unwrap(info[0]);",
      `		q_ = new ${this.wrapClassName}(parent${
        this.hasSubclass ? ", env" : ""
      });`,
      "	} else {",
      `		q_ = new ${this.wrapClassName}(0${this.hasSubclass ? ", env" : ""});`,
      "	}",
      "}",
    ];

    const destructorImpl = [
      `${this.wrapClassName}::~${this.wrapClassName}()`,
      "{",
      "	q_ = NULL",
      "}",
    ];

    const methodsImpl = this.schema.methods.map((method) => {
      return "";
    });

    const eventsImpl = this.events.map((event) => {
      const template = [
        `Napi::Value ${this.wrapClassName}::${event.name}(${Constants.CALLBACK_INFO_PARAM}) `,
        "{",
        "	Napi::Env env = info.Env();",
        "	Napi::HandleScope scope(env)",
        `	q_->${event.name}Callback_ = Napi::Persistent(info[0].As<Napi::Function>()); `,
        "	return Napi::Value();",
        "}",
      ];
      return joinLines(template);
    });

    const template = [
      joinLines(includes),
      " ",
      joinLines(initMethodImpl),
      " ",
      joinLines(constructorImpl),
      " ",
      joinLines(destructorImpl),
      " ",
      joinLines(methodsImpl),
      " ",
      joinLines(eventsImpl),
    ];

    this.componentCode = joinLines(template)
  }

  private generateHpp() {
    const includes = generateIncludes(
      "<napi.h>",
      "<" + this.schema.component + ">",
      ...(this.schema.includes || [])
    );

    const initMethod = `static Napi::Object Init(Napi::Env env, Napi::Object exports);`;

    const constructor = `${this.wrapClassName}(${Constants.CALLBACK_INFO_PARAM});`;
    const destructor = `~${this.wrapClassName}();`;

    const publicAttrs = [
      `${this.nativeInstanceClass} *${this.nativeInstance};`,
    ];
    const privateAttrs = [`static Napi::FunctionReference constructor;`];
    const privateMethods = [
      ...this.methods.map(
        (method) =>
          `Napi::Value ${method.name}(${Constants.CALLBACK_INFO_PARAM});`
      ),
      ...this.events.map((event) => `void ${event.name}(${event.type} *e);`),
    ];

    const wrapClassNameUpper = this.wrapClassName.toUpperCase();
    const template = [
      `#ifndef ${wrapClassNameUpper}_H`,
      `#define ${wrapClassNameUpper}_H`,
      joinLines(includes),
      this.headerSubclassCode,
      " ",
      `class ${this.wrapClassName}: public Napi::ObjectWrap<${this.wrapClassName}>`,
      "{",
      "public:",
      `     ${initMethod}\n`,
      `     ${constructor}`,
      `     ${destructor}\n`,
      joinLines(publicAttrs, 1),
      "private:",
      joinLines(privateAttrs, 1),
      " ",
      joinLines(privateMethods, 1),
      "}",
      " ",
      "#endif",
    ];

    this.headerCode = joinLines(template);
  }
}

QtGenerator.of(components[0]).generate();
