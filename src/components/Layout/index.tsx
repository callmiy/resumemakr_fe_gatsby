import React from "react";

import { useSetupCachePersistor } from "../../utils/context";

export function Layout({ children }: React.PropsWithChildren<{}>) {
  useSetupCachePersistor();

  return <>{children}</>;
}
