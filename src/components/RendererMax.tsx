/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { cameras, controls, drawCommands, entitiesFromSolids, prepareRender } from "@jscad/regl-renderer";
import { useKeyPress } from "../hooks/useKeyPress";
import { useAnimationFrame } from "../hooks/useAnimationFrame";
import { useDrag, usePinch, useWheel } from "@use-gesture/react";

type Solid = any;

interface RendererProps {
  animate?: boolean;
  height?: number;
  options?: {
    gridOptions?: {
      show?: boolean;
      color?: number[];
      subColor?: number[];
      fadeOut?: boolean;
      transparent?: boolean;
      size?: number[];
      ticks?: number[];
    };
    axisOptions?: {
      show?: boolean;
    };
    viewerOptions?: {
      initialPosition?: number[];
      panSpeed?: number;
      rotateSpeed?: number;
      zoomSpeed?: number;
    };
  };
  solids: Solid[];
  width?: number;
}

interface RendererState {
  camera?: any;
  controls?: any;
  element: HTMLDivElement | null;
  inputs: {
    shift: "up" | "down";
    mouse: "up" | "down";
  };
  panDelta: number[];
  render?: (content: any) => void;
  rotateDelta: number[];
  zoomDelta: number;
}

const initialProps = ({ animate, height, options, solids, width }: RendererProps): RendererProps => {
  return {
    animate: animate || false,
    height: height || 480,
    options: {
      gridOptions: {
        show: true,
        color: [0, 0, 0, 1],
        subColor: [0, 0, 1, 0.5],
        fadeOut: false,
        transparent: true,
        size: [144, 144],
        ticks: [12, 1],
        ...options?.gridOptions,
      },
      axisOptions: {
        show: true,
        ...options?.axisOptions,
      },
      viewerOptions: {
        initialPosition: [50, -50, 50],
        panSpeed: 0.75,
        rotateSpeed: 0.002,
        zoomSpeed: 0.03,
        ...options?.viewerOptions,
      },
    },
    solids: solids || [],
    width: width || 480,
  };
};

const initialState = (options: RendererProps["options"]): RendererState => {
  return {
    camera: {
      ...cameras.perspective.defaults,
      position: options?.viewerOptions?.initialPosition,
    },
    controls: controls.orbit.defaults,
    element: null,
    inputs: { mouse: "up", shift: "up" },
    panDelta: [0, 0],
    rotateDelta: [0, 0],
    zoomDelta: 0,
  };
};

type RendererAction =
  | { type: "SET_CAMERA"; payload: RendererState["camera"] }
  | { type: "SET_CONTROLS"; payload: RendererState["controls"] }
  | { type: "SET_ELEMENT"; payload: RendererState["element"] }
  | { type: "SET_INPUTS"; payload: RendererState["inputs"] }
  | { type: "SET_PAN_DELTA"; payload: RendererState["panDelta"] }
  | { type: "SET_RENDER"; payload: RendererState["render"] }
  | { type: "SET_ROTATE_DELTA"; payload: RendererState["rotateDelta"] }
  | { type: "SET_ZOOM_DELTA"; payload: RendererState["zoomDelta"] };

function reducer(state: RendererState, action: RendererAction): RendererState {
  switch (action.type) {
    case "SET_CAMERA": {
      const updated = cameras.perspective.update({ ...state.camera, ...action.payload });
      return {
        ...state,
        camera: { ...action.payload, ...updated },
      };
    }
    case "SET_CONTROLS": {
      const updated = controls.orbit.update({ controls: action.payload, camera: state.camera });
      return {
        ...state,
        controls: { ...action.payload, ...updated.controls },
        camera: { ...state.camera, ...updated.camera },
      };
    }
    case "SET_ELEMENT":
      return { ...state, element: action.payload };
    case "SET_INPUTS":
      return { ...state, inputs: action.payload };
    case "SET_PAN_DELTA":
      return { ...state, panDelta: action.payload };
    case "SET_RENDER":
      return { ...state, render: action.payload };
    case "SET_ROTATE_DELTA":
      return { ...state, rotateDelta: action.payload };
    case "SET_ZOOM_DELTA":
      return { ...state, zoomDelta: action.payload };
  }
}

document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());

const RendererMax = React.forwardRef<HTMLDivElement, RendererProps>((props, forwardRef) => {
  const { animate, height, options, solids, width } = initialProps(props);
  const [state, dispatch] = React.useReducer(reducer, initialState(options));
  const ref = React.useRef<HTMLDivElement>(null);

  const content = React.useMemo(() => {
    return {
      drawCommands: {
        drawGrid: drawCommands.drawGrid,
        drawAxis: drawCommands.drawAxis,
        drawMesh: drawCommands.drawMesh,
      },
      entities: [
        {
          visuals: {
            drawCmd: "drawGrid",
            show: options?.gridOptions?.show,
            color: options?.gridOptions?.color,
            subColor: options?.gridOptions?.subColor,
            fadeOut: options?.gridOptions?.fadeOut,
            transparent: options?.gridOptions?.transparent,
          },
          size: options?.gridOptions?.size,
          ticks: options?.gridOptions?.ticks,
        },
        {
          visuals: {
            drawCmd: "drawAxis",
            show: options?.axisOptions?.show,
          },
        },
        // @ts-ignore
        ...entitiesFromSolids({}, solids),
      ],
    };
  }, [
    options?.axisOptions?.show,
    options?.gridOptions?.color,
    options?.gridOptions?.fadeOut,
    options?.gridOptions?.show,
    options?.gridOptions?.size,
    options?.gridOptions?.subColor,
    options?.gridOptions?.ticks,
    options?.gridOptions?.transparent,
    solids,
  ]);

  useDrag(
    (event) => {
      dispatch({ type: "SET_INPUTS", payload: { ...state.inputs, mouse: event.down ? "down" : "up" } });
      if (state.inputs.mouse === "down" && (state.inputs.shift === "down" || event.touches === 3))
        dispatch({ type: "SET_PAN_DELTA", payload: [-event.delta[0], event.delta[1]] });
      if (state.inputs.mouse === "down" && state.inputs.shift === "up" && event.touches === 1)
        dispatch({ type: "SET_ROTATE_DELTA", payload: [event.delta[0], -event.delta[1]] });
    },
    { target: ref || forwardRef }
  );

  usePinch(
    (event) => {
      if (event.touches === 2) dispatch({ type: "SET_ZOOM_DELTA", payload: -event.delta[0] });
    },
    { target: ref || forwardRef }
  );

  useWheel(
    (event: any) => {
      dispatch({ type: "SET_ZOOM_DELTA", payload: event.delta[1] });
    },
    { target: ref || forwardRef }
  );

  const onShiftDown = React.useCallback(() => {
    dispatch({ type: "SET_INPUTS", payload: { ...state.inputs, shift: "down" } });
  }, [state.inputs]);

  const onShiftUp = React.useCallback(() => {
    dispatch({ type: "SET_INPUTS", payload: { ...state.inputs, shift: "up" } });
  }, [state.inputs]);

  useKeyPress("Shift", onShiftDown, onShiftUp);

  React.useEffect(() => {
    const ref: React.MutableRefObject<HTMLDivElement> = forwardRef as React.MutableRefObject<HTMLDivElement>;
    if (ref && ref.current) dispatch({ type: "SET_ELEMENT", payload: ref.current });
  }, [forwardRef]);

  React.useEffect(() => {
    if (ref && ref.current) dispatch({ type: "SET_ELEMENT", payload: ref.current });
  }, [ref]);

  React.useEffect(() => {
    if (!state.camera) return;
    if (!height) return;
    if (!width) return;
    if (width === state.camera.viewport[2] && height === state.camera.viewport[3]) return;
    dispatch({
      type: "SET_CAMERA",
      payload: cameras.perspective.setProjection(null, state.camera, { height: height, width: width }),
    });
  }, [state.camera, state.element, height, width]);

  React.useEffect(() => {
    if (!state.element || !(state.element instanceof HTMLDivElement)) return;
    if (!height) return;
    if (!width) return;
    if (state.element.clientHeight !== height) state.element.style.height = `${height}px`;
    if (state.element.clientWidth !== width) state.element.style.width = `${width}px`;
  }, [state.element, height, width]);

  React.useEffect(() => {
    if (state.render) return;
    if (!content) return;
    if (!state.element) return;
    if (!state.camera) return;
    dispatch({
      type: "SET_RENDER",
      payload: prepareRender({
        glOptions: { container: state.element },
        // @ts-ignore
        camera: state.camera,
        ...content,
      }),
    });
  }, [content, state]);

  React.useEffect(() => {
    if (!state.panDelta) return;
    if (!state.panDelta[0] && !state.panDelta[1]) return;
    const updated = controls.orbit.pan(
      {
        controls: state.controls,
        camera: state.camera,
        speed: options?.viewerOptions?.panSpeed,
      },
      state.panDelta
    );
    dispatch({ type: "SET_CONTROLS", payload: { ...state.controls, ...updated.controls } });
    dispatch({ type: "SET_CAMERA", payload: { ...state.camera, ...updated.camera } });
    dispatch({ type: "SET_PAN_DELTA", payload: [0, 0] });
  }, [state.camera, state.controls, options?.viewerOptions?.panSpeed, state.panDelta]);

  React.useEffect(() => {
    if (!state.rotateDelta) return;
    if (!state.rotateDelta[0] && !state.rotateDelta[1]) return;
    const updated = controls.orbit.rotate(
      {
        controls: state.controls,
        camera: state.camera,
        speed: options?.viewerOptions?.rotateSpeed,
      },
      state.rotateDelta
    );
    dispatch({ type: "SET_CONTROLS", payload: { ...state.controls, ...updated.controls } });
    dispatch({ type: "SET_ROTATE_DELTA", payload: [0, 0] });
  }, [state.camera, state.controls, options?.viewerOptions?.rotateSpeed, state.rotateDelta]);

  React.useEffect(() => {
    if (!state.zoomDelta || !Number.isFinite(state.zoomDelta)) return;
    const updated = controls.orbit.zoom(
      {
        controls: state.controls,
        camera: state.camera,
        speed: options?.viewerOptions?.zoomSpeed,
      },
      state.zoomDelta
    );
    dispatch({ type: "SET_CONTROLS", payload: { ...state.controls, ...updated.controls } });
    dispatch({ type: "SET_ZOOM_DELTA", payload: 0 });
  }, [state.camera, state.controls, options?.viewerOptions?.zoomSpeed, state.zoomDelta]);

  const render = React.useCallback(() => {
    if (!state.render) return;
    if (!content) return;
    state.render({ camera: state.camera, ...content });
  }, [content, state]);

  React.useEffect(() => {
    if (!animate) render();
  }, [animate, render]);

  useAnimationFrame(!!animate, () => render(), [render]);

  if (!forwardRef) return <div ref={ref} style={{ touchAction: "none" }} />;
  return <div ref={forwardRef} style={{ touchAction: "none" }} />;
});

RendererMax.displayName = "Renderer";

export { RendererMax, initialProps, initialState };
export type { RendererProps, RendererState, RendererAction };
