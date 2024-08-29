import { Banner } from "@douyinfe/semi-ui";
import { MODAL } from "../../../data/constants";

export default function Share({ setModal }) {

  return (
    <div id="share" className="space-y-4">
      <Banner
        fullMode={false}
        type="info"
        icon={null}
        closeIcon={null}
        description={
          <ul className="list-disc ms-4">
            <li>
              Generating a link will create a gist with the JSON representation
              of the diagram.
            </li>
            <li>
              You can create the gist from your account by providing your token
              <button
                onClick={() => setModal(MODAL.GITHUB_TOKEN)}
                className="ms-1 text-sky-500 hover:underline font-semibold"
              >
                here
              </button>
              .
            </li>
            <li>
              Sharing will not create a live real-time collaboration session.
            </li>
          </ul>
        }
      />
     
    </div>
  );
}
