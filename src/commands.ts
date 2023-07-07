/**
 * The command IDs used by the control panel.
 */
export namespace CommandIDs {
  export const createNew = 'glue-control:new-session';

  export const new1DHistogram = 'glue-control:new-1d-histogram-viewer';

  export const new1DProfile = 'glue-control:new-1d-profile-viewer';

  export const new2DImage = 'glue-control:new-2d-image-viewer';

  export const new2DScatter = 'glue-control:new-2d-scatter-viewer';

  export const new3DScatter = 'glue-control:new-3d-scatter-viewer';

  export const newTable = 'glue-control:new-table-viewer';

  export const openControlPanel = 'glue-control:open-control-panel';

  export const closeControlPanel = 'glue-control:close-control-panel';

  export const addViewerLayer = 'glue-control:add-viewer-layer';
}

export interface INewViewerArgs {
  dataset?: string;
  position?: [number, number];
  size?: [number, number];
}
