import * as Yup from "yup";
import { FormikErrors } from "formik";
import { ApolloError } from "apollo-client";
import { WithApolloClient } from "react-apollo";
import { RouteComponentProps } from "@reach/router";

import { LoginInput as FormValues } from "../../graphql/apollo/types/globalTypes";
import { LoginMutationProps } from "../../graphql/apollo/login.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { UserLocalGqlProps } from "../../state/auth.local.query";
import { LoggedOutUserProps } from "../../state/logged-out-user.local.query";

export interface OwnProps extends WithApolloClient<{}>, RouteComponentProps {}

export interface Props
  extends OwnProps,
    LoginMutationProps,
    UserLocalMutationProps,
    UserLocalGqlProps,
    LoggedOutUserProps {}

export const ValidationSchema = Yup.object<FormValues>().shape({
  email: Yup.string()
    .email("Must be valid email address")
    .required(),
  password: Yup.string()
    .required()
    .min(4, "Too short")
});

export const RouterThings = {
  documentTitle: "Log in"
};

export enum Action_Types {
  SET_OTHER_ERRORS = "@login/SET_OTHER_ERRORS",
  SET_FORM_ERROR = "@login/SET_FORM_ERROR",
  SET_GRAPHQL_ERROR = "@login/SET_GRAPHQL_ERROR"
}

export interface State {
  readonly otherErrors?: string;
  readonly formErrors?: FormikErrors<FormValues>;
  readonly graphQlErrors?: ApolloError;
  readonly pwdType?: "password" | "text";
}