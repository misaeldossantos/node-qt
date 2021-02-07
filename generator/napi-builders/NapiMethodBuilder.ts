import { Attrs, Method } from "./../model/GeneratorSchema";
import NapiTypesHelper from "../helpers/NapiTypesHelper";
import { joinLines } from "../Utils";
import { MethodBuilder } from "./MethodBuilder";
import components from "../components.json";

export class NapiMethodBuilder extends MethodBuilder<NapiMethodBuilder> {
  private as: "set" | "get" = "set";
  private returnAttrs: Attrs;
  private paramsTypes: string[] = [];
  private paramsVars = [];
  private scoped = false;

  private _method: Partial<Method> = {};

  private constructor() {
    super();
  }

  static create() {
    const instance = new NapiMethodBuilder();
    instance.withArgs({
      type: "const Napi::CallbackInfo",
      name: "&info",
    });
    return instance;
  }

  withScope() {
    this.scoped = true;
    return this;
  }

  withParamsTypes(...types: string[]) {
    this.paramsTypes = types;
    return this;
  }

  withReturnAttrs(attrs: Attrs) {
    this.returnAttrs = attrs;
    return this;
  }

  asSet() {
    this.as = "set";
    return this;
  }

  withMethodObject(method: Partial<Method>) {
    this._method = method;
    this.returnAttrs = method.returns.attrs;
    this.paramsTypes = method.params?.split(",");
    this.withName(method.name);
    return this;
  }

  requireAllArgs() {
    this._method.paramsRequired = true;
    return this;
  }

  asGet() {
    this.as = "get";
    return this;
  }

  private declareAndConvertParams() {
    this.paramsVars = [];

    this.paramsTypes.forEach((type, index) => {
      const varName = `p${index}`;
      const typeConverted = NapiTypesHelper.convertNapiValueToCppType(
        `info[${index}]`,
        type
      );
      if (type.endsWith("Wrap")) {
        type = type.substring(0, type.length - 4);
      }
      this.withCommand(`${type} ${varName} = ${typeConverted};`);
      this.paramsVars.push(varName);
    });
  }

  private declareEnv() {
    this.withCommand("Napi::Env env = info.Env();");
  }

  build() {
    this.declareEnv();
    if (this.scoped) {
      this.withCommand("Napi::HandleScope scope(env);");
    }
    if (this.as === "set") {
      if (this._method.paramsRequired) {
        this.withCommand(
          joinLines(
            [
              `if(info.Length() != ${this.args.length})`,
              "{",
              "	" + NapiTypesHelper.throwError("Wrong number of arguments"),
              "}",
            ],
            1
          )
        );
        this.declareAndConvertParams();
        this.withCommand(`q_->${this.name}(${this.paramsVars.join(", ")});`);
      }
      this.withReturn("Napi::Value()", "Napi::Value");
    } else {
      const { $source = this.name + "()", ...attrs } = this.returnAttrs;

      this.withCommand("Napi::Object output = Napi::Object::New(env);");
      this.withCommands(
        NapiTypesHelper.cppObjectToNapiObject(
          "output",
          "q_->" + $source,
          attrs
        )
      );
      this.withReturn("output", "Napi::Value");
    }
    return super.build();
  }
}

const result = NapiMethodBuilder.create()
  .withClassName("QScrollBarWrap")
  .withMethodObject(components[0].methods[5])
  //   .withParamsTypes("Integer", "Integer", "Integer")
  .asGet()
  //   .requireAllArgs()
  .build();

console.log(result);
