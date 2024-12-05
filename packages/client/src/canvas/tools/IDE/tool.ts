import { BaseBoxShapeTool, TLClickEventInfo } from 'tldraw';
import { NAME } from './types';
export class IDEShapeTool extends BaseBoxShapeTool {
  static override id = NAME;
  static override initial = 'idle';
  override shapeType = NAME;

  override onDoubleClick(_info: TLClickEventInfo) {
    // you can handle events in handlers like this one;
    // check the BaseBoxShapeTool source as an example
  }
}
