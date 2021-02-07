import { joinLines } from "../Utils";

type Arg = { type: string; name: string }

export class MethodBuilder<T extends MethodBuilder<T> | void> {
  protected className: string;
  protected name: string;
  protected returnType: string;
  protected commands: string[] = [];
  protected args: Arg[] = [];

  // generated result string
  private $args: string;
  private $return: string;

  static create() {
    return new MethodBuilder();
  }

  withClassName(className: string): T {
    this.className = className;
    return this as any;
  }

  withName(name: string): T {
    this.name = name;
    return this as any;
  }

  withArgs(...params: Arg[]): T {
    this.args.push(...params);

    this.$args = params
      .map((param) => `${param.type} ${param.name}`)
      .join(", ");
    return this as any;
  }

  withCommand(command: string): T {
    this.commands.push(command);
    return this as any;
  }

  withCommands(commands: string[]): T {
    this.commands.push(...commands);
    return this as any;
  }

  withReturn(stuff: string, type: string): T {
    this.$return = `return ${stuff};`;
    this.returnType = type;
    return this as any;
  }

  build(): string {
    const template = [
      `${this.returnType ? this.returnType + " " : ""}${this.className}::${
        this.name
      }(${this.$args})`,
      "{",
      joinLines([...this.commands, this.$return], 1),
      "}",
    ];

    return joinLines(template);
  }
}
