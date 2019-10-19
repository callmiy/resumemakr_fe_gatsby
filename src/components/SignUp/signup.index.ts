import { graphql,  withApollo } from "react-apollo";
import compose from 'lodash/flowRight'
import {
  UserRegMutation,
  UserRegMutationVariables
} from "../../graphql/apollo-types/UserRegMutation";
import REG_USER_MUTATION, {
  RegUserFn,
  RegMutationProps
} from "../../graphql/apollo/user-reg.mutation";
import { userLocalMutationGql } from "../../state/user.local.mutation";
import { SignUp as Comp } from "./signup.component";

const regUserGql = graphql<
  {},
  UserRegMutation,
  UserRegMutationVariables,
  RegMutationProps
>(REG_USER_MUTATION, {
  props: props => {
    const mutate = props.mutate as RegUserFn;

    return {
      regUser: mutate
    };
  }
});

export const SignUp = compose(
  withApollo,
  userLocalMutationGql,
  regUserGql
)(Comp);
