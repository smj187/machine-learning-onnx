import { fabric } from "fabric"

declare module "fabric" {
  namespace fabric {
    interface Object {
      id?: number
    }

    interface ICircleOptions extends ICircleOptions {
      id?: number
    }
  }
}
