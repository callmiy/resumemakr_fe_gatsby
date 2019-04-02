import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "gatsby";
import { Button } from "semantic-ui-react";

import Layout from "../components/Layout";
import Header from "../components/Header";
import { makeSiteTitle } from "../constants";
import { ROOT_URL } from "../routing";

export default () => (
  <Layout>
    <Header />

    <Helmet>
      <title>{makeSiteTitle("Page not found")}</title>
    </Helmet>

    <div
      style={{
        padding: "20px",
        textAlign: "center"
      }}
    >
      <h1>You are here at #404!</h1>
      <h3>But this is not where you are going!</h3>

      <Button as={Link} to={ROOT_URL} color="green">
        <span
          style={{
            fontWeight: 900,
            fontSize: "2rem"
          }}
        >
          &larr;
        </span>{" "}
        Get back home
      </Button>
    </div>
  </Layout>
);
