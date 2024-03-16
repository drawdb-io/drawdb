import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { Empty } from "@douyinfe/semi-ui";

export default function NoElements({ title, text }) {
  return (
    <div className="select-none mt-2">
      <Empty
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
