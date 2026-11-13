import { Component, Fragment } from 'react';
import type { PropsWithChildren } from 'react';
import { Button } from '../components/ui/button';
import { Notice, Screen } from '../components/ui/screen';
export class ErrorBoundary extends Component<
  PropsWithChildren,
  { failed: boolean; generation: number }
> {
  override state = { failed: false, generation: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    if (this.state.failed)
      return (
        <Screen>
          <Notice
            title="Cove could not open this view"
            message="Try reopening the app view. Your saved connection is kept."
          />
          <Button
            onPress={() =>
              this.setState((state) => ({
                failed: false,
                generation: state.generation + 1,
              }))
            }
          >
            Reopen Cove
          </Button>
        </Screen>
      );
    return (
      <Fragment key={this.state.generation}>{this.props.children}</Fragment>
    );
  }
}
