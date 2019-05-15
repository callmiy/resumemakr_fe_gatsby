import React from "react";

import { UserFragment } from "../graphql/apollo/types/UserFragment";
import { getUser } from "../State/tokens";

export interface WithUser {
  user?: UserFragment | null;
}

export function withUserHOC<TProps extends WithUser>(
  Component: React.FunctionComponent<TProps> | React.ComponentClass<TProps>
) {
  return function HOC(props: TProps) {
    return <Component user={getUser()} {...props} />;
  };
}
