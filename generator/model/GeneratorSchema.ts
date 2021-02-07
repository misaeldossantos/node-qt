
type Includes = string[]

export type NapiType = "Number" | "String" | "Boolean" | "Array" | "Object"

export type Attrs =  {
     $source?: string,
     [key: string]: NapiType | Attrs | string
}

export type Returns = {
     attrs: Attrs
}

export type Method = {
     name: string,
     params?: string,
     paramsRequired?: boolean,
     returns?: Returns
}

export type EventDef = {
     name: string,
     type: string,
     attrs: Attrs
}

export type Subclass = {
     extends: string,
     includes?: Includes,
     events?: EventDef[] 
}

export type GeneratorSchema = {
     component: string,
     includes?: Includes,
     methods?: Method[]
     subclass?: Subclass
}