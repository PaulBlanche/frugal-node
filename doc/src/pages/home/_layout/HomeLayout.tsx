import { useData } from "@frugal-node/preact/client";
import { BaseLayout, type BaseLayoutProps } from "../../_layout/BaseLayout.tsx";
import { Footer } from "../../_layout/Footer.tsx";
import { TopNavigation } from "../../_layout/TopNavigation.tsx";
import type { Data } from "../type.ts";

export function HomeLayout({ children, ...props }: BaseLayoutProps) {
	const data = useData<Data>();
	return (
		<BaseLayout {...props}>
			<TopNavigation lang={data.lang} />
			{children}
			<Footer />
		</BaseLayout>
	);
}
