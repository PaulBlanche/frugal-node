import { BaseLayout, type BaseLayoutProps } from "../../_layout/BaseLayout.tsx";
import { Footer } from "../../_layout/Footer.tsx";
import { TopNavigation } from "../../_layout/TopNavigation.tsx";

export function HomeLayout({ children, ...props }: BaseLayoutProps) {
	return (
		<BaseLayout {...props}>
			<TopNavigation />
			{children}
			<Footer />
		</BaseLayout>
	);
}
