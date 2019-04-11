// tslint:disable: no-any
import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import {
  render,
  fireEvent,
  wait,
  Matcher,
  MatcherOptions,
  SelectorMatcherOptions
} from "react-testing-library";
import { withFormik } from "formik";
import { WindowLocation } from "@reach/router";
import {
  ResumeForm,
  makeUrlHashSegment
} from "../components/UpdateResumeForm/update-resume-form-x";
import {
  Props,
  formikConfig,
  Section
} from "../components/UpdateResumeForm/update-resume-form";
import { renderWithApollo, fillField } from "./test_utils";
import { makeResumeRoute, ResumePathHash } from "../routing";
import {
  GetResume_getResume,
  GetResume_getResume_experiences
} from "../graphql/apollo/types/GetResume";
import {
  defaultVal,
  emptyVal,
  uiTexts
} from "../components/Experiences/experiences";
import { makeExperienceFieldName } from "../components/Experiences/experiences-x";
import {
  ListDisplayCtrlNames,
  makeListDisplayCtrlTestId
} from "../components/components";
import {
  makeListStringFieldName,
  makeListStringHiddenLabelText
} from "../components/ListStrings/list-strings-x";

type P = React.ComponentType<Partial<Props>>;
const ResumeFormP = ResumeForm as P;
const debounceTime = 0;

/**
 * Mock out the Preview component
 */

jest.mock("../components/Preview", () => {
  return () => <div data-testid="preview-resume-section">1</div>;
});

const location = {
  hash: makeUrlHashSegment(ResumePathHash.edit, Section.experiences),
  pathname: makeResumeRoute("updates experiences", "")
} as WindowLocation;

let mockUpdateResume: jest.Mock;
const fieldName = "experiences";

let getByTestId: (
  text: Matcher,
  options?: MatcherOptions | undefined
) => HTMLElement;

let getByLabelText: (
  text: Matcher,
  options?: SelectorMatcherOptions | undefined
) => HTMLElement;

let queryByLabelText: (
  text: Matcher,
  options?: SelectorMatcherOptions | undefined
) => HTMLElement | null;

describe("Experiences pre-fill/achievements", () => {
  const initial = {
    experiences: [defaultVal]
  } as GetResume_getResume;

  let experience: GetResume_getResume_experiences;
  let achievements: string[];

  const achievementsPrefixFieldName = makeExperienceFieldName(
    0,
    "achievements"
  );

  const achievement0FieldName = makeListStringFieldName(
    achievementsPrefixFieldName,
    0
  );

  const achievement1FieldName = makeListStringFieldName(
    achievementsPrefixFieldName,
    1
  );

  const achievement2FieldName = makeListStringFieldName(
    achievementsPrefixFieldName,
    2
  );

  const achievement0Label = makeListStringHiddenLabelText(
    achievement0FieldName,
    uiTexts.achievementsLabels2
  );

  const achievement1Label = makeListStringHiddenLabelText(
    achievement1FieldName,
    uiTexts.achievementsLabels2
  );

  const achievement2Label = makeListStringHiddenLabelText(
    achievement2FieldName,
    uiTexts.achievementsLabels2
  );

  beforeEach(() => {
    [experience] = initial.experiences as GetResume_getResume_experiences[];

    achievements = experience.achievements as string[];

    mockUpdateResume = jest.fn();

    const props = {
      getResume: initial,
      debounceTime,
      location,
      updateResume: mockUpdateResume
    };

    /**
     * Given user is on update resume page
     */
    const { Ui: ui } = renderWithApollo(ResumeFormP, props);

    const Ui = withFormik(formikConfig)(ui) as P;

    const renderArgs = render(<Ui {...props} />);

    getByTestId = renderArgs.getByTestId;

    getByLabelText = renderArgs.getByLabelText;
  });

  it("pre-fills fields", () => {
    /**
     * User should see that 'position input' has been filled with sample
     */
    const $position = getByLabelText(makeExperienceFieldName(0, "position"));

    expect($position.getAttribute("value")).toEqual(experience.position);

    /**
     * And that 'company input' has been filled with sample texts
     */
    const $company = getByLabelText(makeExperienceFieldName(0, "companyName"));
    expect($company.getAttribute("value")).toEqual(experience.companyName);

    /**
     * And that 'from date input' has been filled with sample texts
     */
    const $fromDate = getByLabelText(makeExperienceFieldName(0, "fromDate"));
    expect($fromDate.getAttribute("value")).toEqual(experience.fromDate);

    /**
     * And that 'to date input' has been filled with sample texts
     */
    const $toDate = getByLabelText(makeExperienceFieldName(0, "toDate"));
    expect($toDate.getAttribute("value")).toEqual(experience.toDate);

    /**
     * And 'achievement 0 input' has been filled with sample texts
     */

    const $achievement0 = getByLabelText(achievement0Label);

    const $achievement0TextContent = $achievement0.textContent as string;

    expect($achievement0TextContent.length).toBeGreaterThan(0);

    expect($achievement0TextContent).toEqual(achievements[0]);

    /**
     * And 'achievement 1 input' has been filled with sample texts
     */

    const $achievement1 = getByLabelText(achievement1Label);

    const $achievement1TextContent = $achievement1.textContent as string;

    expect($achievement1TextContent.length).toBeGreaterThan(1);

    expect($achievement1TextContent).toEqual(achievements[1]);
  });

  it("adds achievement", async () => {
    /**
     * When user clicks on achievement 0 add button
     */
    const $achievement0CtrlAddBtn = getByTestId(
      makeListDisplayCtrlTestId(achievement0FieldName, ListDisplayCtrlNames.add)
    );

    fireEvent.click($achievement0CtrlAddBtn);

    /**
     * Then user should see a newly added empty text box under achievement 0
     */
    const $achievement1 = getByLabelText(achievement1Label);

    expect($achievement1.textContent).toBe("");

    /**
     * And that the previous achievements 1 has been moved down one level
     */

    const $achievement2 = getByLabelText(achievement2Label);

    const $achievement2TextContent = $achievement2.textContent as string;

    expect($achievement2TextContent.length).toBeGreaterThan(1);

    // notice indices 2/1
    expect($achievement2TextContent).toEqual(achievements[1]);

    /**
     * Then the data should be sent to the server
     */

    await wait(
      () => {
        expect(
          mockUpdateResume.mock.calls[0][0].variables.input.experiences[0]
            .achievements
        ).toEqual([achievements[0], "", achievements[1], achievements[2]]);
      },
      {
        interval: 1
      }
    );

    /**
     * When user fills achievement 1 with text
     */

    fillField($achievement1, "new achievement");

    fireEvent.blur($achievement1);

    /**
     * Then the data should be sent to the server
     */
    await wait(
      () => {
        expect(
          mockUpdateResume.mock.calls[1][0].variables.input.experiences[0]
            .achievements
        ).toEqual([
          achievements[0],
          "new achievement",
          achievements[1],
          achievements[2]
        ]);
      },
      {
        interval: 1
      }
    );
  });

  it("removes achievement", async () => {
    /**
     * When user clicks on achievement 1 remove button
     */
    const $achievement1CtrlRemoveBtn = getByTestId(
      makeListDisplayCtrlTestId(
        achievement1FieldName,
        ListDisplayCtrlNames.remove
      )
    );

    fireEvent.click($achievement1CtrlRemoveBtn);

    /**
     * Then the data should be sent to the server
     */

    await wait(
      () => {
        expect(
          mockUpdateResume.mock.calls[0][0].variables.input.experiences[0]
            .achievements
        ).toEqual([achievements[0], achievements[2]]);
      },
      {
        interval: 1
      }
    );

    /**
     * And the previous achievement 2 should move up i.e become 1
     */
    const $achievement1 = getByLabelText(achievement1Label);

    expect($achievement1.textContent).toEqual(achievements[2]);

    /**
     * And achievement 0 should not move
     */
    const $achievement0 = getByLabelText(achievement0Label);

    expect($achievement0.textContent).toEqual(achievements[0]);
  });

  it("swaps achievements up", async () => {
    /**
     * When user clicks on 'move up' button of achievement 1
     */
    const $achievement1CtrlUpBtn = getByTestId(
      makeListDisplayCtrlTestId(
        achievement1FieldName,
        ListDisplayCtrlNames.moveUp
      )
    );

    fireEvent.click($achievement1CtrlUpBtn);

    /**
     * Then achievement 1 should move up i.e. become achievement 0
     */
    const $achievement0 = getByLabelText(achievement0Label);

    expect($achievement0.textContent).toEqual(achievements[1]);

    /**
     * And achievement 0 should move down i.e. become achievement 1
     */
    const $achievement1 = getByLabelText(achievement1Label);

    expect($achievement1.textContent).toEqual(achievements[0]);

    /**
     * And achievement 2 should not move
     */
    const $achievement2 = getByLabelText(achievement2Label);

    expect($achievement2.textContent).toEqual(achievements[2]);

    /**
     * And data should be sent to the server
     */
    const inputAchievements = [
      achievements[1],
      achievements[0],
      achievements[2]
    ];

    await wait(
      () => {
        expect(
          mockUpdateResume.mock.calls[0][0].variables.input.experiences[0]
            .achievements
        ).toEqual(inputAchievements);
      },
      {
        interval: 1
      }
    );
  });

  it("swaps achievements down", async () => {
    /**
     * When user clicks on 'move down' button of achievement 1
     */
    const $achievement1CtrlDownBtn = getByTestId(
      makeListDisplayCtrlTestId(
        achievement1FieldName,
        ListDisplayCtrlNames.moveDown
      )
    );

    fireEvent.click($achievement1CtrlDownBtn);

    /**
     * Then achievement 1 should move down i.e. become achievement 2
     */
    const $achievement2 = getByLabelText(achievement2Label);

    expect($achievement2.textContent).toEqual(achievements[1]);

    /**
     * And achievement 2 should move up i.e. become achievement 1
     */
    const $achievement1 = getByLabelText(achievement1Label);

    expect($achievement1.textContent).toEqual(achievements[2]);

    /**
     * And achievement 0 should not move
     */
    const $achievement0 = getByLabelText(achievement0Label);

    expect($achievement0.textContent).toEqual(achievements[0]);

    /**
     * And data should be sent to the server
     */
    await wait(
      () => {
        expect(
          mockUpdateResume.mock.calls[0][0].variables.input.experiences[0]
            .achievements
        ).toEqual([achievements[0], achievements[2], achievements[1]]);
      },
      {
        interval: 1
      }
    );
  });
});

describe("Experiences - add/remove/swap", () => {
  const experiences = [
    { ...defaultVal, companyName: "company 1" },
    { ...defaultVal, companyName: "company 2", index: 2 },
    { ...defaultVal, companyName: "company 3", index: 3 }
  ] as GetResume_getResume_experiences[];

  const initial = { experiences } as GetResume_getResume;

  const company0LabelText = makeExperienceFieldName(0, "companyName");
  const company1LabelText = makeExperienceFieldName(1, "companyName");
  const company2LabelText = makeExperienceFieldName(2, "companyName");

  beforeEach(() => {
    mockUpdateResume = jest.fn();

    const props = {
      getResume: initial,
      debounceTime,
      location,
      updateResume: mockUpdateResume
    };

    /**
     * Given user is on update resume page
     */
    const { Ui: ui } = renderWithApollo(ResumeFormP, props);

    const Ui = withFormik(formikConfig)(ui) as P;

    const renderArgs = render(<Ui {...props} />);

    getByTestId = renderArgs.getByTestId;

    getByLabelText = renderArgs.getByLabelText;

    queryByLabelText = renderArgs.queryByLabelText;
  });

  it("adds experience in middle", done => {
    /**
     * Given that a user sees company 2 at position 2
     */

    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * When user clicks on add button of experience 1
     */
    const experience1AddCtrlBtnId = makeListDisplayCtrlTestId(
      fieldName,
      ListDisplayCtrlNames.add,
      1
    );

    fireEvent.click(getByTestId(experience1AddCtrlBtnId));

    /**
     * Then company was at position 2 should move to position 3
     */
    const company3LabelText = makeExperienceFieldName(3, "companyName");

    expect((getByLabelText(company3LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * And an empty company should be rendered at position 2
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual("");

    /**
     * And values should be uploaded to server
     */

    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([
        experiences[0],
        experiences[1],
        { ...emptyVal, index: 3 },
        { ...experiences[2], index: 4 }
      ]);
    });

    done();
  });

  it("adds experience to the end", done => {
    /**
     * Given that user does not see any company position 3
     */
    const company3LabelText = makeExperienceFieldName(3, "companyName");
    expect(queryByLabelText(company3LabelText)).not.toBeInTheDocument();

    /**
     * When user clicks the add button of experience 2
     */
    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.add, 2)
      )
    );

    /**
     * Then user should see a company at position 3
     */
    const $company3 = getByLabelText(company3LabelText) as any;

    /**
     * And the input box of the company should be empty
     */
    expect($company3.value).toBe("");

    /**
     * And correct data should be uploaded to the server
     */

    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([...experiences, { ...emptyVal, index: 4 }]);
    });

    done();
  });

  it("removes first experience", done => {
    /**
     * Given that user sees company 0 at position 0
     */

    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[0].companyName
    );

    /**
     * And user sees company 1 at position 1
     */

    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * When user clicks on remove button of experience 0
     */

    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.remove, 0)
      )
    );

    /**
     * Then company that was at position 1 should move to position 0
     */
    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * Then company that was at position 2 should move to position 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * And values should be uploaded to server
     */

    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([
        { ...experiences[1], index: 1 },
        { ...experiences[2], index: 2 }
      ]);
    });

    done();
  });

  it("removes last experience", done => {
    /**
     * Given that user sees company 2 in the document
     */

    expect(getByLabelText(company2LabelText)).toBeInTheDocument();

    /**
     * When user clicks on remove button of experience 2
     */

    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.remove, 2)
      )
    );

    /**
     * Then company 2 should no longer be in the document
     */
    expect(queryByLabelText(company2LabelText)).not.toBeInTheDocument();

    /**
     * And values should be uploaded to server
     */

    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([experiences[0], experiences[1]]);
    });

    done();
  });

  it("removes experience from the middle", done => {
    /**
     * Given that user sees company 1 at position 1
     */

    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And user sees company 2 at position 2
     */

    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * When user clicks on remove button of experience 1
     */

    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.remove, 1)
      )
    );

    /**
     * Then company that was at position 2 should move to position 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * And values should be uploaded to server
     */
    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([experiences[0], { ...experiences[2], index: 2 }]);
    });

    done();
  });

  it("moves experience up from middle", done => {
    /**
     * Given that user sees company 0 at position 0
     */
    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[0].companyName
    );

    /**
     * And user sees company 1 at position 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And user sees company 2 at position 2
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * When user clicks on move up button of experience 1
     */
    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.moveUp, 1)
      )
    );

    /**
     * Then company that was formerly at position 0 should move to position 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[0].companyName
    );

    /**
     * And company that was formerly at position 1 should move to position 0
     */
    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And company at position 2 should not move
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * And the right values have been sent to the server
     */
    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([
        { ...experiences[1], index: 1 },
        { ...experiences[0], index: 2 },
        experiences[2]
      ]);
    });

    done();
  });

  it("moves last experience up", done => {
    /**
     * Given that user sees company 1 at position 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And user sees company 2 at position 2
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * When user clicks on experience 2 move up button
     */
    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.moveUp, 2)
      )
    );

    /**
     * Then company that was formerly at position 1 should move to position 2
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And company that was formerly at position 2 should move to position 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * And company at position 0 should not move
     */
    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[0].companyName
    );

    /**
     * And correct data should be uploaded to the server
     */

    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([
        experiences[0],
        { ...experiences[2], index: 2 },
        { ...experiences[1], index: 3 }
      ]);
    });

    done();
  });

  it("moves experience down from the middle", done => {
    /**
     * Given that user sees company 1 at postion 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And user sees company 2 at position 2
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * When user clicks move down button on experience 1
     */
    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.moveDown, 1)
      )
    );

    /**
     * Then company that was formerly at postion 1 should move to 2
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And company that was formerly at position 2 should move to 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * And company at 0 should not move
     */
    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[0].companyName
    );

    /**
     * And correct data should be uploaded to the server
     */

    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([
        experiences[0],
        { ...experiences[2], index: 2 },
        { ...experiences[1], index: 3 }
      ]);
    });

    done();
  });

  it("moves first experience down", done => {
    /**
     * Given user sees company 0 at postion 0
     */
    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[0].companyName
    );

    /**
     * And user sees company 1 at postion 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * When user clicks the move down button on experience at position 0
     */
    fireEvent.click(
      getByTestId(
        makeListDisplayCtrlTestId(fieldName, ListDisplayCtrlNames.moveDown, 0)
      )
    );

    /**
     * Then company that was formerly at position 0 should move to 1
     */
    expect((getByLabelText(company1LabelText) as any).value).toEqual(
      experiences[0].companyName
    );

    /**
     * And company that was formerly at position 1 should move to 0
     */
    expect((getByLabelText(company0LabelText) as any).value).toEqual(
      experiences[1].companyName
    );

    /**
     * And company at position two should not move
     */
    expect((getByLabelText(company2LabelText) as any).value).toEqual(
      experiences[2].companyName
    );

    /**
     * And correct data should be uploaded to the server
     */

    setTimeout(() => {
      expect(
        mockUpdateResume.mock.calls[0][0].variables.input.experiences
      ).toEqual([
        { ...experiences[1], index: 1 },
        { ...experiences[0], index: 2 },
        experiences[2]
      ]);
    });

    done();
  });
});
