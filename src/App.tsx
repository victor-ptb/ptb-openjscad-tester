import { useEffect, useRef, useState } from "react";
import { RendererOriginal } from "./components/RendererOriginal";
import { cube, polygon, polyhedron } from "@jscad/modeling/src/primitives";
import { CSG, CAG } from "@jscad/csg";
import { extrudeLinear } from "@jscad/modeling/src/operations/extrusions";
import { translate } from "@jscad/modeling/src/operations/transforms";
import { clone } from "@jscad/modeling/src/geometries/geom3";
import { Slider } from "@material-tailwind/react";

export default function App() {
  const windowSize = useRef([window.innerWidth, window.innerHeight]);
  const [solids, setSolids] = useState<any[]>([]);
  const [width, setWidth] = useState<number>(1);
  const [stepSize, setStepSize] = useState<number>(0.3);
  const [totalHeight, setTotalHeight] = useState<number>(3);
  //   const [solids, setSolids] = useState<any[]>([cube({ size: 2 })]);

  useEffect(() => {
    const createMeshSample = () => {
      return polyhedron({
        points: [
          [0, -10, 60],
          [0, 10, 60],
          [0, 10, 0],
          [0, -10, 0],
          [60, -10, 60],
          [60, 10, 60],
          [10, -10, 50],
          [10, 10, 50],
          [10, 10, 30],
          [10, -10, 30],
          [30, -10, 50],
          [30, 10, 50],
        ],
        faces: [
          [0, 2, 3],
          [0, 1, 2],
          [4, 5, 0],
          [5, 1, 0],
          [5, 4, 2],
          [4, 3, 2],
          [6, 9, 8],
          [6, 8, 7],
          [6, 11, 10],
          [6, 7, 11],
          [10, 11, 8],
          [10, 8, 9],
          [3, 9, 0],
          [9, 6, 0],
          [10, 0, 6],
          [0, 10, 4],
          [3, 10, 9],
          [3, 4, 10],
          [1, 11, 7],
          [1, 5, 11],
          [1, 7, 8],
          [2, 1, 8],
          [8, 11, 2],
          [5, 2, 11],
        ],
      });
    };

    const createExtrusionSample = () => {
      const poly = polygon({
        points: [
          [-1, -1],
          [3, -1],
          [3.5, 2],
          [2, 1],
          [1, 2],
          [0, 1],
          [-1, 2],
        ],
      });

      //   return extrudeLinear({ height: 5, twistAngle: Math.PI / 4, twistSteps: 10 }, poly);
      return extrudeLinear({ height: 5 }, poly);
    };

    const createCagSample = () => {
      return CAG.fromPoints([
        [0, 0],
        [5, 0],
        [3, 5],
        [0, 5],
      ]); // CAG built ins
    };

    const createCsgSample = () => {
      let path = new CSG.Path2D(
        [
          [10, 10],
          [-10, 10],
          [-10, -10],
          [-5, -5],
        ],
        /* closed: */ false
      );
      const anotherpath = new CSG.Path2D([[-10, -10]]);
      path = path.concat(anotherpath);
      path = path.appendPoint([10, -10]);
      path = path.close(); // close the path
      return path.rectangularExtrude(3, 4, 16, true); // w, h, resolution, roundEnds
    };

    const createStairs = () => {
      const riseHeightBase = 0.17;
      const numSteps = Math.round(totalHeight / riseHeightBase);
      const riseHeight = totalHeight / numSteps;
      const totalRiseHeight = riseHeight * 2;
      const halfWidth = width * 0.5;

      const poly = polygon({
        points: [
          [0, -halfWidth],
          [stepSize, -halfWidth],
          [stepSize, halfWidth],
          [0, halfWidth],
        ],
      });

      //   return extrudeLinear({ height: 5, twistAngle: Math.PI / 4, twistSteps: 10 }, poly);
      let step = extrudeLinear({ height: totalRiseHeight }, poly);
      step = translate([0, 0, -riseHeight], step);

      const allGeos = [];

      for (let i = 0; i < numSteps; i++) {
        let newStep = clone(step);
        newStep = translate([stepSize * i, 0, riseHeight * i], newStep);
        allGeos.push(newStep);
      }

      return allGeos;
    };

    const geos = createStairs();
    setSolids([...geos]);
  }, [width, stepSize, totalHeight]);

  return (
    <>
      <div className="">
        <div className="fixed flex flex-rows justify-end">
          <div className="w-[30rem] p-4">
            <div className="backdrop-blur bg-white/5 h-full rounded-md p-4 text-gray-300">
              <h1 className="font-montserrat text-lg">Stairs</h1>
              <div className="flex w-full flex-col gap-8">
                <div className="flex flex-row justify-between items-center gap-2">
                  <label htmlFor="" className="text-sm text-right w-32 mx-2">
                    Width: {width}
                  </label>
                  <Slider
                    size="sm"
                    value={width}
                    min={0.6}
                    max={4}
                    onChange={(e) => {
                      setWidth(parseFloat(e.target.value));
                    }}
                  />
                </div>
                <div className="flex flex-row justify-between items-center gap-2">
                  <label htmlFor="" className="text-sm text-right w-32 mx-2">
                    Step: {stepSize}
                  </label>
                  <Slider
                    size="sm"
                    value={stepSize}
                    min={0.25}
                    max={0.6}
                    onChange={(e) => {
                      setStepSize(parseFloat(e.target.value));
                    }}
                  />
                </div>
                <div className="flex flex-row justify-between items-center gap-2">
                  <label htmlFor="" className="text-sm text-right w-32 mx-2">
                    Total Height: {totalHeight}
                  </label>
                  <Slider
                    size="sm"
                    value={totalHeight}
                    min={0.2}
                    max={6}
                    onChange={(e) => {
                      setTotalHeight(parseFloat(e.target.value));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <RendererOriginal solids={solids} width={windowSize.current[0]} height={windowSize.current[1]} />
      </div>
      dd
    </>
  );
}
