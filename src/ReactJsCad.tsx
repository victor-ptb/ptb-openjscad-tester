import { FC, useState } from "react";
import { cube } from "@jscad/modeling/src/primitives";
import { Renderer } from "jscad-react";

const ReactJsCad: FC = () => {
  const [solids] = useState<any[]>([cube({ size: 2 })]);
  return <Renderer solids={solids} height={500} width={500} />;
};

export default ReactJsCad;
