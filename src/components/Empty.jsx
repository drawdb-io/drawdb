import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { Empty as SemiUIEmpty } from "@douyinfe/semi-ui";

export default function Empty({ title, text }) {
  return (
    <div className="select-none mt-2">
      <SemiUIEmpty
        image={<IllustrationNoContent style={{ width: 154, height: 154 }} />}
        darkModeImage={
          <IllustrationNoContentDark style={{ width: 154, height: 154 }} />
        }
        title={title}
        description={text}
      />
    </div>
  );
}
